import myw from 'myWorld-client';
import React, { useState, useEffect } from 'react';
import { useLocale } from 'myWorld-client/react';
import { DraggableModal, Button } from 'myWorld-client/react';
import { Avatar, Cascader, List } from 'antd';
import greenImg from '../../images/green_circle.png';
import redImg from '../../images/red_circle.png';
import wfm from '../../../../workflow_manager/public/js/base/wfm.js';
import {
    buildFeatureList,
    validate,
    createTicketObject,
    buildFields
} from './fieldValidatorFunctions.js';

export const FieldValidatorModal = ({ open }) => {
    const appRef = myw.app;
    const db = appRef.database;
    const { msg } = useLocale('customRuleModal');

    const [isOpen, setIsOpen] = useState(open);

    const [featuresList, setFeaturesList] = useState([]);
    const [features, setFeatures] = useState();
    const [ruleType, setRuleType] = useState();
    const [pickedRule, setPickedRule] = useState('');
    const [inputtedValue, setInputtedValue] = useState('');
    const [pickedFeatureType, setPickedFeatureType] = useState('');
    const [pickedField, setPickedField] = useState('');
    const [result, setResult] = useState([]);

    //Effect that runs after the initial render and queries the database for the list of features.
    //It also populates the featureList state that will be used to present the list of features and
    //fields to the user
    useEffect(() => {
        const dbFeatures = db.getFeatureTypes();

        //Filtering out some of the features just to have a shorter list of features for the demo
        const filteredFeatures = Object.keys(dbFeatures)
            .filter(
                key =>
                    !/(IN|OUT|processed|comsof|mywwfm|spec|coax|copper|conduit|mywcom|ticket|iqgapp)/.test(
                        key
                    )
            )
            .reduce((obj, key) => {
                obj[key] = dbFeatures[key];
                return obj;
            }, {});

        setFeatures(filteredFeatures);

        let featuresListArray = [];
        featuresListArray = buildFeatureList(filteredFeatures);
        setFeaturesList(featuresListArray);
    }, []);

    const handleCancel = () => {
        setIsOpen(false);
    };

    //Function called when the user selects a feature and a field from the cascader component
    const onFieldSelected = value => {
        const cleanType = features[value[0]].fields[value[1]].type.replace(/\(\d+\)$/, '');
        setRuleType(cleanType);
        setPickedFeatureType(value[0]);
        setPickedField(value[1]);
        setPickedRule('');
        setInputtedValue('');
        setResult([]);
    };

    //Function called when the user types a value in the input field. In case of number fields
    //it validates the input to ensure that it is numbers only or empty before it actually sets
    //the state
    const onValueChange = e => {
        if (ruleType === 'integer' || ruleType === 'double') {
            const regex = /^\d+$/;
            if (regex.test(e.target.value) || e.target.value === '') {
                setInputtedValue(e.target.value);
            }
        } else {
            setInputtedValue(e.target.value);
        }
    };

    //Function called when the user presses the OK button, it validates the rule for all features
    //within the current map bounds
    const validateRule = async () => {
        setResult([]); //Resets the result state
        let tempResult = [];
        //Queries the database for all the features of the user's picked type that are within
        //the current map bounds
        db.getFeatures(pickedFeatureType, { bounds: appRef.map.getBounds() }).then(result => {
            for (const feature in result) {
                if (result[feature]?.properties) {
                    const props = result[feature]?.properties;
                    typeof props[pickedField] === 'number' //If the type of the picked field is a number, limit the number of floating point digits to 2
                        ? (props[pickedField] = props[pickedField].toFixed(2))
                        : props[pickedField];
                    //Create the result object containing:
                    //feature: the feature that was validated
                    //result: a boolean with the result of the validation (true or false)
                    const newResult = {
                        feature: result[feature],
                        result: validate(props[pickedField], pickedRule, inputtedValue)
                    };
                    tempResult.push(newResult);
                }
            }
            setResult(tempResult);
        });
    };

    //Function that creates the WFM ticket in the database
    const createTicket = async itemObj => {
        const ticketObj = createTicketObject(
            itemObj,
            pickedRule,
            pickedField,
            inputtedValue,
            pickedFeatureType
        );

        //Redux is the global state manager library that provides state persistence in WFM
        //Here the ticket is actually created in the database and the notification is show to the user
        //const { createTicket } = wfm.redux.tickets;
        //await wfm.store.dispatch(createTicket({ values: ticketObj }));
    };

    //Creates the input fields to be shown to the user, calls the buildFields function from the
    //fieldValidatorFunctions.js file
    const renderFields = () => {
        switch (ruleType) {
            case 'integer':
            case 'double':
                return (
                    <div>
                        {buildFields(
                            [
                                { value: '<', label: '<' },
                                { value: '>', label: '>' }
                            ],
                            setPickedRule,
                            pickedFeatureType + ' - ' + pickedField,
                            inputtedValue,
                            onValueChange
                        )}
                    </div>
                );
            case 'string':
                return (
                    <div>
                        {buildFields(
                            [
                                { value: 'have', label: msg('have_radio') },
                                { value: 'notHave', label: msg('have_not_radio') }
                            ],
                            setPickedRule,
                            pickedFeatureType + ' - ' + pickedField,
                            inputtedValue,
                            onValueChange
                        )}
                    </div>
                );
            case 'boolean':
                return (
                    <div>
                        {buildFields(
                            [
                                { value: 'true', label: msg('true_radio') },
                                { value: 'false', label: msg('false_radio') }
                            ],
                            setPickedRule
                        )}
                    </div>
                );
        }
    };

    //Builds the list element with the result of the rule validation for each of the features
    const renderResult = () => {
        return (
            <div>
                <br />
                <List
                    size="small"
                    bordered
                    //The list datasource is the result State containing the result objects
                    dataSource={result}
                    header={pickedFeatureType + ' / ' + pickedField + msg('query_result')}
                    renderItem={listItem => (
                        <List.Item>
                            <List.Item.Meta
                                //When click an item on the list the map zooms to the feature and sets it as the current feature
                                onClick={() => {
                                    appRef.map.zoomTo(listItem.feature);
                                    appRef.setCurrentFeature(listItem.feature);
                                }}
                                //Each feature on the list shows a red or green circle depending on the result of the validation
                                avatar={
                                    item.result ? (
                                        <Avatar src={greenImg} />
                                    ) : (
                                        <Avatar src={redImg} />
                                    )
                                }
                                title={
                                    listItem.feature.properties.name +
                                    ' - ' +
                                    listItem.feature.properties[pickedField]
                                }
                            />
                            {!listItem.result ? (
                                // If the result valus is false, this means that the feature failed the check, so the "Create WFM ticket" button is shown
                                <Button
                                    type="primary"
                                    onClick={() => createTicket(item.resultFeature)}
                                >
                                    {msg('wfm_ticket_button')}
                                </Button>
                            ) : null}
                        </List.Item>
                    )}
                />
            </div>
        );
    };

    return (
        <DraggableModal
            wrapClassName="custom-rules-modal"
            open={isOpen}
            title={msg('windowHeader')} //Localisation key for the title of the modal
            width={500}
            onCancel={handleCancel}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Cancel
                </Button>,
                <Button key="ok" onClick={validateRule} type="primary">
                    OK
                </Button>
            ]}
        >
            {/* <Cascader options={featuresList} onChange={onFieldSelected} /> 
            {renderFields()}
            {true && result.length > 0 ? renderResult() : null} */}
        </DraggableModal>
    );
};
